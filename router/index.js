var router  = require("express").Router();

router.get("/", function (req, res) {
	res.render('index.html')
});

router.get("/roomReady", function (req, res) {
	res.json({
		body: {
			//roomId: new Date().getTime().toString()
			roomId: Math.random () * 100
		}
	});
});

module.exports = router;
