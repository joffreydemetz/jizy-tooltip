import fs from 'fs';
import path from 'path';
import { LogMe, jPackConfig } from 'jizy-packer';

function generateLessVariablesFromConfig(variablesPath) {
    LogMe.log('Build lib/less/_variables.less');
    const desktopBreakpoint = jPackConfig.get('desktopBreakpoint') ?? '768px';
    let content = `@desktop-breakpoint: ${desktopBreakpoint};` + "\n";
    content += `@mobile-breakpoint: @desktop-breakpoint - 1px;`;
    fs.writeFileSync(variablesPath, content, { encoding: 'utf8' });
}

function deleteLessVariablesFile(variablesPath) {
    if (fs.existsSync(variablesPath)) {
        LogMe.log('Delete lib/less/_variables.less');
        fs.unlinkSync(variablesPath);
    }
}

const jPackData = function () {
    const lessBuildVariablesPath = path.join(jPackConfig.get('basePath'), 'lib', 'less', '_variables.less');

    jPackConfig.sets({
        name: 'jTooltip',
        alias: 'jizy-tooltip'
    });

    jPackConfig.set('onCheckConfig', () => { });

    jPackConfig.set('onGenerateBuildJs', (code) => {
        generateLessVariablesFromConfig(lessBuildVariablesPath);
        return code;
    });

    jPackConfig.set('onGenerateWrappedJs', (wrapped) => wrapped);

    jPackConfig.set('onPacked', () => {
        deleteLessVariablesFile(lessBuildVariablesPath);
    });
};

export default jPackData;

