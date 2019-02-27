var router  = require("express").Router();

router.get("/", function (req, res) {
	res.render('index.html')
});

router.get("/roomReady", function (req, res) {
	res.json({
		body: {
			roomId: new Date().getTime()
		}
	});
});

module.exports = router;
