const sh = require('shelljs');

sh.cd(__dirname + '/../');

// fetch community repo
sh.rm('-rf','scripts/community');
sh.exec('npx degit sveltejs/community scripts/community');

// copy over relevant files
sh.cp('scripts/community/whos-using-sapper/WhosUsingSapper.svelte', 'src/routes/_components/WhosUsingSapper.svelte');
sh.rm('-rf', 'static/organisations');
sh.cp('-r', 'scripts/community/whos-using-sapper/organisations', 'static');
