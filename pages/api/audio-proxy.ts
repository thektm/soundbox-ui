import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
	res.status(501).json({
		error: "Not implemented",
		message: "This endpoint is a placeholder. Implement audio proxy logic here.",
	});
}

