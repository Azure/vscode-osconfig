/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as Mocha from 'mocha';
import * as glob from 'glob';
import * as path from 'path';

export function run(): Promise<void> {
  const testsRoot = __dirname;
  const mochaFile = path.resolve(testsRoot, '../../../test-results.xml');

  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    reporter: 'mocha-junit-reporter',
    reporterOptions: {
      mochaFile
    }
  });

  mocha.timeout(1000000);


  return new Promise((resolve, reject) => {
    glob('**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        return reject(err);
      }

      // Add files to the test suite
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        mocha.run(failures => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  });
}
