/**
 * 3rd party components
 */
const express = require('express');
const path = require('path');
const cors = require('cors');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const askReportCommon = require('./lib/ask-report-common');
const app = express();

/**
 * My components
 */
const utils = require('./utils')
const config = require('./config');
const { vonageTellsUsReportIsReady } = require('./lib/vonage-tells-report-is-ready');
const { readStore, getReport } = require('./lib/reportStore');
const { renderReport } = require('./lib/renderReport');
const PORT = config.PORT;

app.set('trust proxy', 1);

/**
 * Neru & Login
 */
const { neru, State } = require('neru-alpha');
const passport = require('passport');
const initializePassport = require('./initializePassport');
const neruSession = neru.getGlobalSession();
const globalState = new State(neruSession);
const userStore = require('./common/user_store');
const SESSIONS_HASH = 'sessions';

/**
 * Custom session store using Neru State API
 */
class NeruSessionStore extends session.Store {
    constructor(state) {
        super();
        this.state = state;
    }

    async get(sid, callback) {
        try {
            const data = await this.state.hget(SESSIONS_HASH, sid);
            const sess = data ? JSON.parse(data) : null;
            callback(null, sess);
        } catch (err) {
            callback(err);
        }
    }

    async set(sid, sessionData, callback) {
        try {
            await this.state.hset(SESSIONS_HASH, {
                [sid]: JSON.stringify(sessionData)
            });
            callback(null);
        } catch (err) {
            callback(err);
        }
    }

    async destroy(sid, callback) {
        try {
            await this.state.hdel(SESSIONS_HASH, [sid]); // hdel takes array of keys
            callback(null);
        } catch (err) {
            callback(err);
        }
    }

    async touch(sid, sessionData, callback) {
        // Update session to refresh expiry
        await this.set(sid, sessionData, callback);
    }
}

/**
 * Custom rate limit store using Neru State API
 */
class NeruRateLimitStore {
    constructor(state) {
        this.state = state;
        this.prefix = 'ratelimit:';
    }

    async increment(key) {
        const storeKey = this.prefix + key;
        const result = await this.state.incrby(storeKey, 1);

        // Set expiry on first increment
        if (parseInt(result) === 1) {
            await this.state.expire(storeKey, 900); // 15 minutes
        }

        return {
            totalHits: parseInt(result),
            resetTime: new Date(Date.now() + 900000)
        };
    }

    async decrement(key) {
        const storeKey = this.prefix + key;
        await this.state.decrby(storeKey, 1);
    }

    async resetKey(key) {
        const storeKey = this.prefix + key;
        await this.state.delete(storeKey);
    }
}

/**
 * Sessions with Neru
 */
app.use(session({
    store: new NeruSessionStore(globalState),
    secret: config.apiSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, httpOnly: true, sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 }
}));

/**
 * Enable CORS
 */
app.use(cors({
    origin: process.env.VCR_INSTANCE_PUBLIC_URL,
    credentials: true,  // Allow cookies
}));


/**
 * MIDDLEWARE
 */
const askReportWithCredentialsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: 'Too many attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: new NeruRateLimitStore(globalState),
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
/**
 * We have EJS as templating engine
 */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
/**
 * Serve static files
 */
app.use(express.static('public'));

/**
 * Using Passport for login
 */
initializePassport(
    passport,
    async (email) => {
        const customer = await globalState.hget('users', email);
        return customer ? JSON.parse(customer) : null;
    },
);

/**
 * Reports API columns to labels
 */
const COLUMN_LABELS = {
    'account_id': 'Account ID',
    'country_name': 'Country Name',
    'provider': 'Provider',
    'session_type': 'Session Type',
    'status': 'Status',
    'estimated_price': 'Estimated Price',
    'total_price': 'Total Price',
    'message_id': 'Message ID',
    'client_ref': 'Client Reference',
    'direction': 'Direction',
    'from': 'From',
    'to': 'To',
    'message_body': 'Message body',
    'country': 'Country Code',
    'currency': 'Currency',
    'date_received': 'Date Received',
    'date_finalized': 'Date Finalized',
    'latency': 'Latency',
    'error_code': 'Error Code',
    'network': 'Network',
    'network_name': 'Network Name'
};

/**
 * Helper function to get label from the reports API
 */
function getLabel(columnName) {
    return COLUMN_LABELS[columnName] || columnName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

//
//  Home
//  Shows the Form to send the report
//
app.get('/', utils.checkAuthenticated, (req, res) => {
    res.render('index', {
        title: 'CSV Pivot Report Generator',
        COLUMN_LABELS
    })
})

//
//  Get past reports
//  User can require to see past reports from the UI
//
app.get('/reports/history', utils.checkAuthenticated, async (req, res) => {
    const allReports = await readStore();

    // Filter to only show reports belonging to the current user
    const userReports = allReports
        .filter(r => r.userEmail === req.email)  // Filter to get only this user's report
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20);

    res.status(200).json({
        success: true,
        reports: userReports
    });
})

//
//  Is report ready?
//  The UI queries this to check if the report is ready.
//
app.get('/reports/ready/:requestId', utils.checkAuthenticated, async (req, res) => {

    console.log('Asking if report id is ready: ', req.params)

    const item = await getReport(req.params.requestId);
    console.log('readyData: ', item)

    if (!item) {
        return res.status(200).json({
            success: false,
            message: 'Request ID not found'
        })
    }

    return res.status(200).json({
        success: true,
        ready: item.ready,
        csvPath: item.csvPath,
        payload: item
    })

})

//
//  Ask for Vonage Messages API Report
//  This is sent from the UI
//
app.post('/ask-report', askReportWithCredentialsLimiter, utils.checkAuthenticated, async (req, res) => {

    //  Set timeout for this specific request
    //  This report is syncronous now. It can take time.
    //  In my coming version I'm implementing a callback
    req.setTimeout(60000); // 60 seconds

    await askReportCommon.run(req, res, config.apiKey, config.apiSecret);
})

//
//  Ask for Vonage Messages API Report
//  IMPORTANT: It won't check for authentication since the credenmtials arrive in the payload.
//
app.post('/ask-report-with-credentials', askReportWithCredentialsLimiter, async (req, res) => {
    
    //  Set timeout for this specific request
    //  This report is syncronous now. It can take time.
    //  In my coming version I'm implementing a callback
    req.setTimeout(60000); // 60 seconds

    const {
        apiKey
    } = req.body;

    //  Validate: the request must be for the local api key only
    if (!apiKey || apiKey != config.apiKey) {
        return res.status(400).render('error', {
            error: 'We need "apiKey"',
            title: 'Missing apiKey'
        });
    }

    try {
        await askReportCommon.run(req, res, apiKey);
    } catch(ex) {
        console.log(ex.message);
        res.status(200).json({
            success: false,
            message: 'Error generating report'
        })
    }
})

//
//  You can also ask for the report via POSTMAN or similar
//  See README for instructions.
//  IMPORTANT: The request body must contain apiKey and apiSecret. That's the security for this endpoint.
//
app.post('/ask-report-api', askReportWithCredentialsLimiter, async (req, res) => {
    try {
        const processReportViaPost = require('./lib/process-report-via-post');
        await processReportViaPost.run(req, res, req.body);
    } catch(ex) {
        console.log(ex.message)
        res.status(200).json({
            success: false,
            message: 'Error processing report'
        })
    }
})

//
// This is the route to finally generate the report 
// based on the CSV file. Then we render the UI.
//
app.post('/generate-report', utils.checkAuthenticated, async (req, res) => {
    try {
        await renderReport(req, res, getLabel);
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            title: 'Error',
            error: err.message
        });
    }
})

//
//  Allow to open a history report
//
app.post('/reports/open/:requestId', utils.checkAuthenticated, async (req, res) => {
    const report = await getReport(req.params.requestId);
    console.log('/reports/open/:requestId', report)

    // 1. Check if the report exists
    if (!report) {
        return res.status(404).render('error', { 
            title: 'Error', 
            error: 'Report not found' 
        });
    }

    if (!report.ready || !report.requestId) {
        return res.status(200).render('error', {
            title: 'Error',
            error: 'Report not found or not ready'
        });
    }

    req.body = {
        requestId: report.requestId,
        dateFrom: report.payload.dateFrom,
        dateTo: report.payload.dateTo,
        accountId: report.payload.accountId,
        groupBy: report.payload.groupBy,
        internalGroupBy: report.payload.internalGroupBy,
        showTotalBy: report.payload.showTotalBy,
        priceColumns: report.payload.priceColumns
    };

    try {
        await renderReport(req, res, getLabel);
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            title: 'Error',
            error: err.message
        });
    }
})

/**
 * This is the Callback URL we provide to Vonage 
 * so Reports API sends us the ZIP file here.
 */
app.post('/reports/callback/:token', async (req, res) => {
    await vonageTellsUsReportIsReady(req, res);
})

/**
 * Shows the UI for creating a new user
 */
app.get('/new-user', async (req, res) => {
    res.render('users-new', {});
})

/**
 * Shows the UI for entering credentials
 */
app.get('/login', askReportWithCredentialsLimiter, async (req, res) => {
    const allUsers = await userStore.getAllUsers(globalState);
    if (!allUsers || allUsers.length == 0) {
        //  Create first user
        res.render('users-new', {});
    } else {
        res.render('login', { messages: { error: null } });
    }
})

/**
 * Create a user
 * It will create a user ONLY if the Users 
 * table does not exist.
 */
app.post('/admin/users/create', async (req, res) => {
    const fn = require('./actions/admin_create_user');
    fn.action(req, res, globalState);
})

/**
 * Checks for credentials entered in the UI
 */
app.post('/login', utils.checkNotAuthenticated, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {

        if (err) return next(err);
        if (!user) {
            return res.status(401).send('Login failed - see logs');
        }

        req.logIn(user, (err) => {
            if (err) return next(err);
            console.log('[AUTH] Login successful');
            return res.redirect('/');
        });
    })(req, res, next);
})


/**
 * This is VCR specific
 */
app.get('/_/health', async (req, res) => {
    res.sendStatus(200);
});

/**
 * This is VCR specific
 */
app.get('/_/metrics', async (req, res) => {
    res.sendStatus(200);
});

/**
 * Starts the server
 */
app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
