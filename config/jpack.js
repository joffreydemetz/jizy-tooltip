import path from 'path';
import {
    jPackConfig,
    generateLessVariablesFromConfig,
    deleteLessVariablesFile
} from 'jizy-packer';

const jPackData = function () {
    const lessBuildVariablesPath = path.join(jPackConfig.get('basePath'), 'lib/less/_variables.less');

    jPackConfig.sets({
        name: 'jTooltip',
        alias: 'jizy-tooltip',
        lessVariables: {
            desktopBreakpoint: '768px'
        }
    });

    jPackConfig.set('onCheckConfig', () => { });

    jPackConfig.set('onGenerateBuildJs', (code) => {
        const lessVariables = jPackConfig.get('lessVariables') ?? {};
        const lessOriginalVariablesPath = path.join(jPackConfig.get('basePath'), 'lib/less/variables.less');
        generateLessVariablesFromConfig(lessOriginalVariablesPath, lessBuildVariablesPath, lessVariables);
        return code;
    });

    jPackConfig.set('onGenerateWrappedJs', (wrapped) => wrapped);

    jPackConfig.set('onPacked', () => {
        deleteLessVariablesFile(lessBuildVariablesPath);
    });
};

export default jPackData;
