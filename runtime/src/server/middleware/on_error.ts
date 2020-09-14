import { Req, Res } from '@sapper/internal/manifest-server';

export type OnError = (ctx: {
	req: Req;
	statusCode: number;
	error: Error | string;
	routeType: RouteType;
	customizeResponse: (handler: (res: Res) => void) => void;
}) => any;

export enum RouteType {
	ServerRoute = 0,
	Page = 1
}

export function sendErrorResponse({
	onError,
	defaultResponse,
	req,
	res,
	routeType,
	error
}: {
	req: Req;
	res: Res;
	routeType: RouteType;
	statusCode: number;
	error: Error | string;
	onError?: OnError;
	defaultResponse: () => void;
}) {
	if (onError) {
		let sendDefaultResponse = true;

		function customizeResponse(handler: (res: Res) => void) {
			handler(res);
			sendDefaultResponse = false;
		}

		onError({
			req,
			statusCode: 500,
			routeType,
			error,
			customizeResponse
		});

		if (sendDefaultResponse) {
			defaultResponse();
		}
	}
}
