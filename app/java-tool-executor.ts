const exec = require('child_process').exec;
const remote = require('electron').remote;


/**
 * @author Thomas Kleinke
 */
export module JavaToolExecutor {

    const REQUIRED_JAVA_VERSION: number = 8;


    export function executeJavaTool(jarName: string, jarArguments: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            exec(getCommand(jarName, jarArguments),
                (error: string, stdout: string, stderr: string) => {
                    if (error) {
                        console.error(error);
                        reject('Jar execution failed');
                    } else if (stderr !== '') {
                        reject(stderr);
                    } else {
                        resolve();
                    }
                });
        });
    }


    export function getParameterFromErrorMessage(error: string): string {

        const separatorPosition: number = error.indexOf(' ');

        if (separatorPosition === -1 || separatorPosition === error.length - 1) {
            return '';
        } else {
            return error.substring(separatorPosition + 1);
        }
    }


    export async function isJavaInstalled(): Promise<boolean> {

        return await getJavaVersion() >= REQUIRED_JAVA_VERSION;
    }


    function getJavaVersion(): Promise<number> {

        return new Promise(resolve => {
            exec('java -version', (error: string, stdout: string, stderr: string) => {
                if (new RegExp('java version').test(stderr)) {
                    resolve(parseInt(getVersionString(stderr).split('.')[1]));
                } else if (new RegExp('openjdk version').test(stderr)) {
                    resolve(parseInt(getVersionString(stderr).split('.')[0]));
                } else {
                    resolve(0);
                }
            });
        });
    }


    function getCommand(jarName: string, jarArguments: string): string {

        return 'java -Djava.awt.headless=true -jar ' + getJarPath(jarName) + ' ' + jarArguments;
    }


    function getJarPath(jarName: string): string {

        return remote.getGlobal('toolsPath') + '/' + jarName;
    }


    function getVersionString(stderr: string): string {

        return stderr.split(' ')[2].replace(/"/g, '');
    }
}