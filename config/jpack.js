import { jPackConfig } from 'jizy-packer';

const jPackData = function () {
    jPackConfig.sets({
        name: 'jTooltip',
        alias: 'jizy-tooltip'
    });

    jPackConfig.set('onCheckConfig', () => { });
    jPackConfig.set('onGenerateBuildJs', (code) => code);
    jPackConfig.set('onGenerateWrappedJs', (wrapped) => wrapped);
    jPackConfig.set('onPacked', () => { });
};

export default jPackData;
