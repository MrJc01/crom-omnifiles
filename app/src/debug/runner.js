/**
 * CROMVA TEST RUNNER
 * 
 * Adapted for OmniFiles.
 * Run via console: OmniTest.runAll()
 */

const OmniTest = {
    results: [],
    currentSuite: null,

    styles: {
        pass: 'color: #10b981; font-weight: bold;',
        fail: 'color: #ef4444; font-weight: bold;',
        suite: 'color: #3b82f6; font-weight: bold; font-size: 14px;',
        info: 'color: #6b7280;',
        title: 'color: #f59e0b; font-weight: bold; font-size: 16px;'
    },

    assert(condition, message) {
        if (condition) this.pass(message);
        else this.fail(message);
        return condition;
    },

    assertEqual(actual, expected, message) {
        const pass = actual === expected;
        if (pass) this.pass(`${message}: ${actual}`);
        else this.fail(`${message}: expected "${expected}", got "${actual}"`);
        return pass;
    },

    assertExists(value, message) {
        const pass = value !== undefined && value !== null;
        if (pass) this.pass(`${message}: exists`);
        else this.fail(`${message}: does not exist`);
        return pass;
    },

    pass(message) {
        console.log(`%c  ✓ PASS%c ${message}`, this.styles.pass, this.styles.info);
        this.results.push({ suite: this.currentSuite, status: 'pass', message });
    },

    fail(message) {
        console.log(`%c  ✗ FAIL%c ${message}`, this.styles.fail, this.styles.info);
        this.results.push({ suite: this.currentSuite, status: 'fail', message });
    },

    suite(name, tests) {
        console.log(`\n%c▸ ${name}`, this.styles.suite);
        this.currentSuite = name;
        try {
            tests();
        } catch (e) {
            this.fail(`Error in suite: ${e.message}`);
            console.error(e);
        }
    },

    tests: {},

    register(name, fn) {
        this.tests[name] = fn;
    },

    async run(name) {
        if (!this.tests[name]) {
            console.error(`Test "${name}" not found`);
            return;
        }
        console.log(`%c🧪 OMNIFILES TESTS - ${name.toUpperCase()}`, this.styles.title);
        this.results = [];
        await this.tests[name]();
        this.summary();
    },

    async runAll() {
        console.log(`%c🧪 OMNIFILES TESTS - FULL SUITE`, this.styles.title);
        this.results = [];
        for (const name of Object.keys(this.tests)) {
            await this.tests[name]();
        }
        this.summary();
    },

    summary() {
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const total = this.results.length;

        console.log('\n' + '─'.repeat(50));
        console.log(`%c📊 RESULT: ${passed}/${total} passed`,
            failed === 0 ? this.styles.pass : this.styles.fail);

        if (failed > 0) {
            console.log(`%c\n❌ FAILURES:`, this.styles.fail);
            this.results
                .filter(r => r.status === 'fail')
                .forEach(r => console.log(`   • [${r.suite}] ${r.message}`));
        }
        console.log('─'.repeat(50));
    }
};

window.OmniTest = OmniTest;
export default OmniTest;
