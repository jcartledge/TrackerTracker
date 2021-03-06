var fs = require('fs');
var pivotal = require('pivotal');
var exec = require('child_process').exec;

var TWO_YEARS = 2 * 365 * 24 * 60 * 60 * 1000;
var PIVOTAL_TOKEN_COOKIE = 'pivotalToken';
var TEAMCITY_HOSTNAME_COOKIE = 'teamcityHostname';
var TEAMCITY_USERNAME_COOKIE = 'teamcityUsername';
var TEAMCITY_PASSWORD_COOKIE = 'teamcityPassword';

exports.index = function (req, res) {
  fs.readFile('./fingerprint', function (err, data) {
    if (err) {
      console.log('Fingerprint file not found, using current timestamp instead.');
    }
    res.render('index', { timestamp: data || new Date().getTime() });
  });
};

exports.hasToken = function (req, res, next) {
  if (req.cookies[PIVOTAL_TOKEN_COOKIE]) {
    pivotal.useToken(req.cookies[PIVOTAL_TOKEN_COOKIE]);
    res.cookie(PIVOTAL_TOKEN_COOKIE, req.cookies[PIVOTAL_TOKEN_COOKIE], { maxAge: TWO_YEARS });
    next();
  }
};

exports.getProjects = function (req, res) {
  pivotal.getProjects(function (err, results) {
    res.json(results || {});
  });
};

exports.getIterations = function (req, res) {
  pivotal.getCurrentBacklogIterations(req.query.projectID, function (err, results) {
    res.json(results || {});
  });
};

exports.getStories = function (req, res) {
  pivotal.getStories(req.query.projectID, { limit: 500, filter: req.query.filter }, function (err, results) {
    res.json(results || {});
  });
};

exports.addStory = function (req, res) {
  pivotal.addStory(req.body.projectID, req.body.data, function (err, results) {
    res.json(true);
  });
};

exports.updateStory = function (req, res) {
  pivotal.updateStory(req.body.projectID, req.body.storyID, req.body.data, function (err, results) {
    res.json(true);
  });
};

exports.addStoryComment = function (req, res) {
  pivotal.addStoryComment(req.body.projectID, req.body.storyID, req.body.comment, function (err, results) {
    res.json(true);
  });
};

exports.moveStory = function (req, res) {
  var moveData = { target: req.body.target, move: req.body.placement };
  pivotal.moveStory(req.body.projectID, req.body.storyID, moveData, function (err, results) {
    res.json(true);
  });
};

exports.getTeamcityBuildStatus = function (req, res) {
  if (req.cookies[TEAMCITY_HOSTNAME_COOKIE] &&
    req.cookies[TEAMCITY_USERNAME_COOKIE] &&
    req.cookies[TEAMCITY_PASSWORD_COOKIE]) {

    var command = 'curl -u ' + req.cookies[TEAMCITY_USERNAME_COOKIE] + ':' +
      req.cookies[TEAMCITY_PASSWORD_COOKIE] + ' -X GET "' +
      req.cookies[TEAMCITY_HOSTNAME_COOKIE] + '/searchResults.html?query=' +
      req.query.storyID + '&popupMode=true"';

    exec(command, function(err, stdout, stderr) {
      res.send(stdout || '');
    });
  } else {
    res.send('');
  }
};
