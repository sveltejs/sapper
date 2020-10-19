import { minify } from 'html-minifier';

export default function minify_html(html: string) {
	return minify(html, {
		collapseBooleanAttributes: true,
		collapseWhitespace: true,
		conservativeCollapse: true,
		decodeEntities: true,
		html5: true,
		ignoreCustomComments: [/^#/],
		minifyCSS: true,
		minifyJS: false,
		removeAttributeQuotes: true,
		removeComments: true,
		removeOptionalTags: true,
		removeRedundantAttributes: true,
		removeScriptTypeAttributes: true,
		removeStyleLinkTypeAttributes: true,
		sortAttributes: true,
		sortClassName: true
	});
}
