(function (module) {
    "use strict";

    var User = module.parent.require('./user'),
        meta = module.parent.require('./meta'),
        db = module.parent.require('../src/database'),
        passport = module.parent.require('passport'),
        passportLdap = require('passport-ldap').Strategy,
        fs = module.parent.require('fs'),
        path = module.parent.require('path'),
        nconf = module.parent.require('nconf');

    var constants = Object.freeze({
        'name': "LDAP Account",
        'admin': {
            'route': '/plugins/sso-ldap',
            'icon': 'fa-user'
        }
    });

    var Ldap = {};

    Ldap.init = function (app, middleware, controllers) {
        function render(req, res, next) {
            res.render('admin/plugins/sso-ldap', {});
        }

        app.get('/admin/plugins/sso-ldap', middleware.admin.buildHeader, render);
        app.get('/api/admin/plugins/sso-ldap', render);
    };

    Ldap.getStrategy = function (strategies, callback) {
        meta.settings.get('sso-ldap', function (err, settings) {
            if (!err && settings['server'] && settings['username'] && settings['secret'] && settings['base'] && settings['filter'] && settings['attributes'] && settings['searchAttributes']) {
                passport.use(new passportLdap({
                    server: {
                        url: settings['server']
                    },
                    usernameField: settings['username'],
                    passwordField: settings['secret'],
                    base: (settings['base']).split(','),
                    search: {
                        filter: settings['filter'],
                        scope: 'sub',
                        attributes: (settings['attributes']).split(','),
                        sizeLimit: 1
                    },
                    searchAttributes: settings['searchAttributes']

                }, function (accessToken, refreshToken, profile, callback) {
                    Ldap.login(profile.id, profile.displayName, profile.emails[0].value, function (err, user) {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, user);
                    });
                }));

                strategies.push({
                    name: 'ldap',
                    url: '/auth/ldap',
                    callbackURL: '/auth/ldap/callback',
                    icon: 'fa-user',
                });
            }

            callback(null, strategies);
        });
    };

    Ldap.login = function (ldapId, handle, email, callback) {
        Ldap.getUidByLdapId(LdapId, function (err, uid) {
            if (err) {
                return callback(err);
            }

            if (uid !== null) {
                // Existing User
                return callback(null, {
                    uid: uid
                });
            } else {
                // New User
                var success = function (uid) {
                    // Save provider-specific information to the user
                    User.setUserField(uid, 'ldapid', ldapId);
                    db.setObjectField('ldapid:uid', ldapId, uid);
                    callback(null, {
                        uid: uid
                    });
                };

                return User.getUidByEmail(email, function (err, uid) {
                    if (err) {
                        return callback(err);
                    }

                    if (!uid) {
                        return User.create({username: handle, email: email}, function (err, uid) {
                            if (err) {
                                return callback(err);
                            }

                            return success(uid);
                        });
                    } else {
                        return success(uid); // Existing account -- merge
                    }
                });
            }
        });
    };

    Ldap.getUidByLdapId = function (ldapid, callback) {
        db.getObjectField('ldapid:uid', ldapid, function (err, uid) {
            if (err) {
                return callback(err);
            }
            return callback(null, uid);
        });
    };

    Ldap.addMenuItem = function (custom_header, callback) {
        custom_header.authentication.push({
            "route": constants.admin.route,
            "icon": constants.admin.icon,
            "name": constants.name
        });

        callback(null, custom_header);
    };

    module.exports = Ldap;
}(module));
