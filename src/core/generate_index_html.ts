import * as fs from 'fs';
import * as path from 'path';
import { BuildInfo } from "./create_compilers/interfaces";
import { posixify, write_if_changed } from "../utils";

export function create_index_html({
		basepath,
		build_info,
		dev,
		output,
		cwd,
		src,
		dest,
		ssr,
		hashbang,
		template_file = 'template.html',
		service_worker
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
		template_file?: string,
		service_worker?: boolean
	}
) {

	const build_dir = posixify(path.relative(cwd, dest));
	const src_dir = posixify(path.relative(cwd, src));

	const template = dev
		? () => read_template(src_dir, template_file)
		: (str => () => str)(read_template(build_dir, template_file));


	let script = `__SAPPER__={${[
		'ssr:false',
		`hashbang:${hashbang ? 'true' : 'false'}`,
		`baseUrl:'${basepath || ''}'`,
		'preloaded:[]',
		'session:{user:null}'
	].join(',')}};`;

	if (service_worker) {
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


	const body = template()
		.replace('%sapper.base%', () => `<base href="${basepath}/">`)
		.replace('%sapper.scripts%', () => `<script>${script}</script>`)
		.replace('%sapper.TIMESTAMP%', () => process.env.TIMESTAMP || Date.now().toString())
		.replace('%sapper.html%', () => '')
		.replace('%sapper.head%', () => '')
		.replace('%sapper.styles%', () => '');


	write_if_changed(`${build_dir}/index.html`, body);
}

function read_template(dir: string, file: string) {
	return fs.readFileSync(path.resolve(dir, file), 'utf-8');
}

