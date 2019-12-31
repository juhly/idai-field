(function(global) {
    var config = {};

    var defaultConfiguration = { main: 'index.js', defaultExtension: 'js' };

    config.packages = {
        'app': {
            main: 'main.js',
            format: 'cjs',
            defaultExtension: 'js'
        },
        'node_modules': {
            defaultExtension: 'js'
        },
        'config': {
            defaultExtension: false,
            meta: {
                '*.json': {
                    loader: 'json'
                }
            }
        },
        '@angular/common/http': {
            main: '../bundles/common-http.umd.js',
            defaultExtension: 'js'
        },
        'rxjs': defaultConfiguration,
        'rxjs/operators': defaultConfiguration,
        'rxjs/internal-compatibility': defaultConfiguration,
        'rxjs/testing': defaultConfiguration,
        'rxjs/ajax': defaultConfiguration,
        'rxjs/webSocket': defaultConfiguration,
        'rxjs-compat': defaultConfiguration,
        'tsfun': defaultConfiguration,
        'tsfun-core': defaultConfiguration,
        'tsfun-extra': defaultConfiguration,
        'idai-components-2': defaultConfiguration,
        'angular-uuid': defaultConfiguration
    };

    var ngPackageNames = [
        'common',
        'compiler',
        'core',
        'http',
        'platform-browser',
        'platform-browser-dynamic',
        'router',
        'forms'
    ];

    function packUmd(pkgName) {
        config.packages['@angular/' + pkgName] = {
            main: 'bundles/' + pkgName + '.umd.js',
            defaultExtension: 'js'
        };
    }

    ngPackageNames.forEach(packUmd);

    config.map = {
        'app': 'app',
        '@angular': 'node_modules/@angular',
        '@ng-bootstrap/ng-bootstrap': 'node_modules/@ng-bootstrap/ng-bootstrap/bundles/ng-bootstrap.umd.js',
        '@ngx-translate/i18n-polyfill': 'node_modules/@ngx-translate/i18n-polyfill/bundles/ngx-translate-i18n-polyfill.umd.js',
        'json': 'app/util/systemjs-json-plugin',
        'rxjs': 'node_modules/rxjs',
        'rxjs-compat': 'node_modules/rxjs-compat',
        'ts-md5': 'node_modules/ts-md5',
        'idai-components-2' : 'node_modules/idai-components-2',
        'tsfun' : 'node_modules/tsfun',
        'tsfun-core' : 'node_modules/tsfun-core',
        'tsfun-extra' : 'node_modules/tsfun-extra',
        'pouchdb': 'node_modules/pouchdb/dist/pouchdb.js',
        'fs' : '@node/fs',
        'express': '@node/express',
        'express-pouchdb': '@node/express-pouchdb',
        'electron': 'app/desktop/electron',
        'deep-equal': 'node_modules/deep-equal/index.js',
        'moment': 'node_modules/moment/min/moment-with-locales.js',
        'os': '@node/os',
        'buffer': '@node/buffer',
        'viz.js': 'node_modules/viz.js/viz.js',
        'svg-pan-zoom': 'node_modules/svg-pan-zoom/dist/svg-pan-zoom.js',
        'stream': '@node/stream',
        'util': '@node/util',
        'string_decoder': '@node/string_decoder',
        'pouchdb-load': 'node_modules/pouchdb-load/dist/pouchdb.load.js',
        'pouchdb-replication-stream': 'node_modules/pouchdb-replication-stream/dist/pouchdb.replication-stream.js',
        'showdown': 'node_modules/showdown/dist/showdown.js',
        'angular2-uuid': 'node_modules/angular2-uuid/index.js',
        'papaparse': '@node/papaparse',
        'child_process': '@node/child_process',
        'geojson-rewind': 'node_modules/geojson-rewind/index.js',
        '@mapbox/geojson-area': 'node_modules/@mapbox/geojson-area/index.js',
        'wgs84': 'node_modules/wgs84/index.js',
        'address': 'node_modules/address/lib/address.js'
    };

    config.meta = {
        'node_modules/papaparse/papaparse.js': { format: 'global', exports: 'Papa' }
    };

    System.config(config);
})(this);