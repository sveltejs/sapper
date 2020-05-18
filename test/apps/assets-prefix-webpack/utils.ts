/**
 * @param link [Http Link Header string]
 */
export const validateLink = (link: string, reg: RegExp) => {
	return link.split(',').every((l: string) => reg.test(l.trim()));
};