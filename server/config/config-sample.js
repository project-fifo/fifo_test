// CONFIG
// ======

exports.config = {
    listenPort: '1337',
    testing: {
        specAdminUname: 'xxx',
        specAdminPword: 'xxx',
    },
    session: {
        secret: 'keyboard-cat'
    },
    os: {
        cores: 4
    },
    FiFo: [
        {
            dc: 'Name',
            url: 'http://xxx.xxx.xxx.xxx',
            version: '0.1.0',
            username: 'admin',
            password: 'admin'
        }
    ]
};
