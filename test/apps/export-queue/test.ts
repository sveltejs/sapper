import * as api from '../../../api';

describe('export-queue', function() {
	this.timeout(10000);

	// hooks
	before('build app', () => api.build({ cwd: __dirname }));

	// tests
	it('exports a site with inconsistent load time', async () => {
		await api.export({ cwd: __dirname });
	});
});
