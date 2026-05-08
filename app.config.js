const appJson = require("./app.json");

export default {
	expo: {
		...appJson.expo,
		android: {
			package: "com.bittukumar.recurrly",
		},
		ios: {
			bundleIdentifier: "com.bittukumar.recurrly",
		},
		extra: {
			...(appJson.expo?.extra || {}),
			posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
			posthogHost: process.env.POSTHOG_HOST,
		},
	},
};
