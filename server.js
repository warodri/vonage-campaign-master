const express = require('express');
const path = require('path');
const config = require('./config');
const { vonageTellsUsReportIsReady } = require('./lib/vonage-tells-report-is-ready');
const { askForReport } = require('./lib/ask-for-report');
const { addReport, readStore, getReport } = require('./lib/reportStore');
const { renderReport } = require('./lib/renderReport');
const cors = require('cors');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

app.set('trust proxy', 1);

app.use(
    session({
        secret: 'secretcat',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // OK for now
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);

// Enable CORS for all origins and methods
app.use(cors({
    origin: true,        // reflect request origin
    credentials: true,   // ALLOW cookies
}));

const PORT = config.PORT;

//  Neru & Login
const { neru, State } = require('neru-alpha');
const passport = require('passport');
const initializePassport = require('./initializePassport');
const sessionStore = neru.getGlobalSession();
const globalState = new State(sessionStore);  // In debug this loses the data. Deploy is fine. Make sure your vcr.yml file contains "preserve-data: true" for debug

const userStore = require('./common/user_store')
const utils = require('./utils')

//  MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

initializePassport(
    passport,
    async (email) => {
        const customer = await globalState.hget('users', email);
        return customer ? JSON.parse(customer) : null;
    },
);

// Label mapping for display names
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
    'country': 'Country Code',
    'currency': 'Currency',
    'date_received': 'Date Received',
    'date_finalized': 'Date Finalized',
    'latency': 'Latency',
    'error_code': 'Error Code',
    'network': 'Network',
    'network_name': 'Network Name'
};

// Helper function to get label
function getLabel(columnName) {
    return COLUMN_LABELS[columnName] || columnName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//
// Home route - shows the form
//
app.get('/', utils.checkAuthenticated, (req, res) => {
    res.render('index', {
        title: 'CSV Pivot Report Generator',
        COLUMN_LABELS
    });
});

//
//  Get past reports
//
app.get('/reports/history', utils.checkAuthenticated, (req, res) => {
    const reports = readStore()
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20); // last 20 reports

    res.status(200).json({
        success: true,
        reports
    });
});

//
// Is report ready?
//
app.get('/reports/ready/:requestId', (req, res) => {
    if (!req.params.requestId) {
        return res.status(200).json({
            success: false,
            message: 'Invalid request ID'
        })
    }

    const item = getReport(req.params.requestId);
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
});

//
// Ask for Vonage Messages API Report
//
app.post('/ask-report', utils.checkAuthenticated, async (req, res) => {

    const {
        accountId,
        dateFrom,
        dateTo,
        includeSubaccounts,
        groupBy,
        internalGroupBy,
        showTotalBy,
        priceColumns
    } = req.body;

    if (!dateFrom || !dateTo) {
        return res.status(400).render('error', {
            error: 'Date range is required',
            title: 'Error'
        });
    }

    const response = await askForReport(
        config.apiKey,
        config.apiSecret,
        accountId,
        dateFrom,
        dateTo,
        includeSubaccounts,
        groupBy,
        internalGroupBy,
        showTotalBy,
        priceColumns
    );

    if (response) {

        const requestId = response.request_id;

        //  Store for later
        addReport({
            requestId,
            payload: req.body,
            ready: false,
            csvPath: null,
            createdAt: Date.now()
        });

        return res.status(200).json({
            success: true,
            request_id: requestId
        })

    } else {
        return res.status(200).json({
            success: false
        })
    }
})

//
// Generate report route
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
});

//
//  Allow to open a history report
//
app.post('/reports/open/:requestId', utils.checkAuthenticated, async (req, res) => {
    const report = getReport(req.params.requestId);

    if (!report || !report.ready || !report.csvPath) {
        return res.status(200).render('error', {
            title: 'Error',
            error: 'Report not found or not ready'
        });
    }

    // Inject expected body
    req.body = {
        csvPath: report.csvPath,
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
});

//  Waiting for Vonage's reports
app.post('/reports/callback/:token', async (req, res) => {
    await vonageTellsUsReportIsReady(req, res);
})


// Create account
app.get('/new-user', async (req, res) => {
    res.render('users-new', {});
})

// Login
app.get('/login', async (req, res) => {
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
 * Login
 */
app.post('/login', utils.checkNotAuthenticated, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        console.log('[AUTH] err:', err);
        console.log('[AUTH] user:', user);
        console.log('[AUTH] info:', info);

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
});





// VCR
app.get('/_/health', async (req, res) => {
    res.sendStatus(200);
});

//  VCR
app.get('/_/metrics', async (req, res) => {
    res.sendStatus(200);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
