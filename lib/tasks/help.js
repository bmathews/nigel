module.exports = function (nigel, config, register) {
    register("*", [], "Shows help for all tasks", function (message, outputStream) {
        var out = "";
        nigel.globalList.forEach(function (plugin) {
            out += "Plugin: " + plugin.name + "\n";
            plugin.tasks.forEach(function (task) {
                out += "   Task: " + task.name + "\n   Description: " + task.help + "\n\n";
            });
        });
        out += "\n";
        nigel.projectList.forEach(function (project) {
            out += "Project: " + project.name + "\n";
            project.plugins.forEach(function (plugin) {
                out += "   Plugin: " + plugin.name + "\n";
                plugin.tasks.forEach(function (task) {
                    out += "      Task: " + task.name + "\n      Description: " + task.help + "\n\n";
                });
            });
        });
        outputStream.end(out);
    });
};