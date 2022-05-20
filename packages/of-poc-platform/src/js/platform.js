export const CONTAINER_ID = 'layout-container';
window.addEventListener('DOMContentLoaded', () => {
    fin.Platform.Layout.init({ containerId: CONTAINER_ID });
});
