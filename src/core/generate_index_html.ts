import * as fs from 'fs';
import * as path from 'path';
import {BuildInfo} from "./create_compilers/interfaces";
import {posixify, write_if_changed} from "../utils";

export function create_index_html({
		basepath,
		build_info,
		dev,
		output,
		cwd,
		src,
	dest,
	ssr,
	hashbang
	}: {
		basepath: string,
		build_info: BuildInfo;
		dev: boolean;
		output: string;
		cwd: string,
		src: string,
		dest: string,
		ssr: boolean,
		hashbang: boolean,
	}
) {

	const build_dir = posixify(path.relative(cwd, dest));
	const src_dir = posixify(path.relative(cwd, src));

	const template = dev
		? () => read_template(src_dir)
		: (str => () => str)(read_template(build_dir));


	let script = `__SAPPER__={${[
		'ssr:false',
		`hashbang:${hashbang ? 'true' : 'false'}`,
		`baseUrl:'${basepath || ''}'`,
		'preloaded:[]',
		'session:{user:null}',
	].join(',')}};`;

	const has_service_worker = fs.existsSync(path.join(build_dir, 'service-worker.js'));
	if (has_service_worker) {
		script += `if('serviceWorker' in navigator)navigator.serviceWorker.register('${basepath}/service-worker.js');`;
	}

	const file = [].concat(build_info.assets.main).filter(file => file && /\.js$/.test(file))[0];
	const main = `${basepath}/client/${file}`;

	if (build_info.bundler === 'rollup') {
		if (build_info.legacy_assets) {
			const legacy_main = `${basepath}/client/legacy/${build_info.legacy_assets.main}`;
			script += `(function(){try{eval("async function x(){}");var main="${main}"}catch(e){main="${legacy_main}"};var s=document.createElement("script");try{new Function("if(0)import('')")();s.src=main;s.type="module";s.crossOrigin="use-credentials";}catch(e){s.src="${basepath}/client/shimport@${build_info.shimport}.js";s.setAttribute("data-main",main);}document.head.appendChild(s);}());`;
		} else {
			script += `var s=document.createElement("script");try{new Function("if(0)import('')")();s.src="${main}";s.type="module";s.crossOrigin="use-credentials";}catch(e){s.src="${basepath}/client/shimport@${build_info.shimport}.js";s.setAttribute("data-main","${main}")}document.head.appendChild(s)`;
		}
	} else {
		script += `</script><script src="${main}">`;
	}

	let styles: string;

	if (build_info.css && build_info.css.main) {
		const css_chunks = new Set();
		if (build_info.css.main) css_chunks.add(build_info.css.main);

		styles = Array.from(css_chunks)
			.map(href => `<link rel="stylesheet" href="client/${href}">`)
			.join('')
	} else {
		styles = '';
	}

	const body = template()
		.replace('%sapper.base%', () => `<base href="${basepath}/">`)
		.replace('%sapper.scripts%', () => `<script>${script}</script>`)
		.replace('%sapper.html%', () => '')
		.replace('%sapper.head%', () => '')
		.replace('%sapper.styles%', () => styles);


	write_if_changed(`${build_dir}/index.html`, body);
}

function read_template(dir: string) {
	return fs.readFileSync(`${dir}/template.html`, 'utf-8');
}

