module.exports = function(app){
    app.use('/', require('./rt-index.js'));
    app.use('/profile', require('./rt-profile.js'));
    app.use('/login', require('./rt-login.js'));
    app.use('/signup', require('./rt-signup.js'));
    app.use('/team', require('./rt-team.js'));
    app.use('/program', require('./rt-program.js'));
    app.use('/event', require('./rt-event.js'));
    app.use('/admin', require('./rt-admin.js'));
    app.use('/public', require('./public'));

    app.get('/logout',
        function(req, res){
            req.logout();
            res.redirect('/');
        });

// catch 404 and forward to error handler
    app.use(function(req, res, next) {
        const err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

// error handler
    app.use(function(err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });

};