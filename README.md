nigel
=====

[![Build Status](https://travis-ci.org/moonsspoon/nigel.png?branch=master)](https://travis-ci.org/moonsspoon/nigel)
## Installing

Requires node 0.11.* ran with `--harmony` flag

```
$ npm install
$ node --harmony index.js
```

## Plugins
 * Jira
 * Confluence
 * Jenkins
 * Cloudbees
 * Rock Paper Scissors
 * Quote of the Day

## Task API

#### run(context, options, output)

 * context will be application obj
 * options will be task params
 * output will be an output stream
 * 
 
####
```
// psuedo task api
getBugs: function (nigel, options) {
  return "herp derp"
};

nigel.registerTask("list", "this gets a list of bugs", getBugs);
nigel.registerTask("resolve", "resolve [id]", resolveBug);

// psuedo code for nigel task registration
registerTask: function (cmd, help, fun) {
  app.get(currentProject + "/" cmd + "/", function (req, res) {
    fun.call(self, req.options);
  });
}
```
