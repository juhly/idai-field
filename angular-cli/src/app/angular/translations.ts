const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;
const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');

/**
 * @author Thomas Kleinke
 */
export module Translations {

    export function getTranslations(): string {

        const locale: string = remote.getGlobal('config').locale;
        const filePath: string = remote.app.getAppPath() + '/src/app/i18n/messages.' + locale + '.xlf';

        return fs.readFileSync(filePath, 'utf8');
    }
}
