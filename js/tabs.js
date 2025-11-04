function setupTabs() {
    const tablist = document.querySelector('[role="tablist"]');
    const tabs = document.querySelectorAll('[role="tab"]');
    const contents = document.querySelectorAll('[role="tabpanel"]');
    let tabFocus = 0;

    if (tablist) {
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                selectTab(tab, index);
            });

            tab.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    tabs[tabFocus].setAttribute('tabindex', -1);
                    tabFocus++;
                    if (tabFocus >= tabs.length) tabFocus = 0;
                    tabs[tabFocus].setAttribute('tabindex', 0);
                    tabs[tabFocus].focus();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    tabs[tabFocus].setAttribute('tabindex', -1);
                    tabFocus--;
                    if (tabFocus < 0) tabFocus = tabs.length - 1;
                    tabs[tabFocus].setAttribute('tabindex', 0);
                    tabs[tabFocus].focus();
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectTab(tab, index);
                }
            });
        });
    }

    function selectTab(clickedTab, index) {
        const targetId = clickedTab.dataset.tab;
        const targetPanel = document.getElementById(targetId);

        tabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
            tab.setAttribute('tabindex', -1);
        });

        clickedTab.classList.add('active');
        clickedTab.setAttribute('aria-selected', 'true');
        clickedTab.setAttribute('tabindex', 0);
        tabFocus = index;

        contents.forEach(panel => {
            panel.classList.remove('active');
            panel.setAttribute('aria-hidden', 'true');
        });

        if (targetPanel) {
            targetPanel.classList.add('active');
            targetPanel.setAttribute('aria-hidden', 'false');
            targetPanel.focus();
        }
    }
}

document.addEventListener('DOMContentLoaded', setupTabs);