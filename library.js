(function(module) {
    "use strict";

    var User = module.parent.require('./user'),
        db = module.parent.require('../src/database'),
        meta = module.parent.require('./meta'),
        passport = module.parent.require('passport'),
        passportLdap = require('passport-ldap').Strategy,
        fs = module.parent.require('fs'),
        path = module.parent.require('path');

    var constants = Object.freeze({
        'name': "ldap",
        'admin': {
            'icon': 'fa-ldap',
            'route': '/ldap'
        }
    });

    var Ldap = {};

    Ldap.getStrategy = function(strategies, callback) {
        if (meta.config['social:ldap:id'] && meta.config['social:ldap:secret']) {
            passport.use(new passportLdap({
                server: { url: meta.config['social:ldap:server']},
                usernameField: meta.config['social:ldap:username'],
                passwordField: meta.config['social.ldap.password'],
                base: meta.config['social.ldap.base'],
                search: {
                    filter: meta.config['social.ldap.search'],
                    scope: 'sub',
                    attributes: meta.config['social.ldap.attributes']
                    sizeLimit: 1
                },
                searchAttributes: ['displayName']
            }, function(token, tokenSecret, profile, done) {
                console.log(profile);
                var email = ''
                if(profile.emails && profile.emails.length){
                    email = profile.emails[0].value
                }
                var picture = profile.avatarUrl;
                if(profile._json.avatar_large){
                    picture = profile._json.avatar_large;
                }
                Ldap.login(profile.id, profile.username, email, picture, function(err, user) {
                    if (err) {
                        return done(err);
                    }
                    done(null, user);
                });
            }));

            strategies.push({
                name: 'ldap',
                url: '/auth/ldap',
                icon: 'ldap',
                scope: 'user:email'
            });
        }
        
        callback(null, strategies);
    };

    Ldap.login = function(ldapID, username, email, picture, callback) {
        if (!email) {
            email = username + '@users.noreply.ldap.com';
        }
        
        Ldap.getUidByLdapID(ldapID, function(err, uid) {
            if (err) {
                return callback(err);
            }

            if (uid) {
                // Existing User
                callback(null, {
                    uid: uid
                });
            } else {
                // New User
                var success = function(uid) {
                    User.setUserField(uid, 'ldapid', ldapID);
                    db.setObjectField('ldapid:uid', ldapID, uid);
                    callback(null, {
                        uid: uid
                    });
                };

                User.getUidByEmail(email, function(err, uid) {
                    if (!uid) {
                        User.create({username: username, email: email, picture:picture, uploadedpicture:picture}, function(err, uid) {
                            if (err !== null) {
                                callback(err);
                            } else {
                                success(uid);
                            }
                        });
                    } else {
                        success(uid); // Existing account -- merge
                    }
                });
            }
        });
    };

    Ldap.getUidByLdapID = function(ldapID, callback) {
        db.getObjectField('ldapid:uid', ldapID, function(err, uid) {
            if (err) {
                callback(err);
            } else {
                callback(null, uid);
            }
        });
    };

    Ldap.addMenuItem = function(custom_header, callback) {
        custom_header.authentication.push({
            "route": constants.admin.route,
            "icon": constants.admin.icon,
            "name": constants.name
        });

        callback(null, custom_header);
    };

    function renderAdmin(req, res, callback) {
        res.render('sso/ldap/admin', {});
    }

    Ldap.init = function(app, middleware, controllers) {
        app.get('/admin/ldap', middleware.admin.buildHeader, renderAdmin);
        app.get('/api/admin/ldap', renderAdmin);
    };

    module.exports = Ldap;
}(module));
