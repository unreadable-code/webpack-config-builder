"use strict";

const os = require("os");

const ESLintPlugin = require("eslint-webpack-plugin");
const LicensePlugin = require("license-webpack-plugin").LicenseWebpackPlugin;
const TerserJSPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");

const platform = os.platform();

const ProdMode = "production";

function normalizeEntryPointName(entry) {
    if (entry.startsWith("./"))
        entry = entry.slice(2);

    if (entry.startsWith("src/"))
        entry = entry.slice(4);

    return entry.replace(/\//g, "-");
}

function buildConfig(env, argv) {
    var result = {
        output: {
            publicPath: "",
        },

        resolve: {
            extensions: [
                `.${platform}.ts`,
                `.${platform}.js`,
                ".ts",
                ".js",
            ],
        },

        module: {
            rules: [
                {
                    test: /\.(j|t)s(x?)$/i,
                    exclude: /node_modules/,
                    use: [
                        "babel-loader",
                    ],
                },
            ],
        },

        plugins: [
            new ESLintPlugin({
              files: "src/**/*.ts",
            }),
        ],

        definitions: {},
        licenseConfig: {
            licenseTypeOverrides: {},
        },
        unacceptableLicenses: new Set(),
    };

    this.directives.forEach(function (d) {
        d.call(result, argv);
    });

    if (argv.mode === "production") {
        result.devtool = undefined;

        result.optimization = {
            minimize: true,
            minimizer: [
                new TerserJSPlugin({
                    parallel: true,
                    terserOptions: {},
                    exclude: /\.(sa|sc|c)ss$/i,
                }),
            ],
        };

        const unacceptableLicenses = result.unacceptableLicenses;

        const licensePluginConfig = {
            outputFilename: `ATTRIBUTION.${normalizeEntryPointName(result.entry)}.json`,
            ...result.licenseConfig,
            handleMissingLicenseType: (packageName) => {
                console.warn(`Package missing license: ${packageName}`);
                return null;
            },
            unacceptableLicenseTest: l => unacceptableLicenses.has(l),
            handleUnacceptableLicense: (p, l) => {
                console.error(`Found unacceptable license: ${p}#${l}`);
            },
        };

        result.plugins.push(new LicensePlugin(licensePluginConfig));
    } else {
        result.devtool = "source-map";
    }

    result.plugins.push(new webpack.DefinePlugin(result.definitions));

    delete result.definitions;
    delete result.licenseConfig;
    delete result.unacceptableLicenses;

    return result;
}

const methods = {
    directives: Object.freeze([]),

    withExtension: function withExtension(...extensions) {
        return extend(this, function () {
            this.resolve.extensions.push(...extensions);
        });
    },

    withPlugin: function withPlugin(type, config, debugConfig) {
        return extend(this, function ({mode}) {
            const cfg = !debugConfig || mode == ProdMode ? config : debugConfig;
            const plugin = new type(cfg);
            this.plugins.push(plugin);
        });
    },

    withRule: function withRule(rule) {
        return extend(this, function () {
            this.module.rules.push(rule);
        });
    },

    withAssets: function withAssets(test) {
        return this.withRule({
            test,
            type: "asset/resource",
            dependency: { not: ["url"] },
        });
    },

    withDefine: function withDefine(symbol, value, debugValue) {
        return extend(this, function ({mode}) {
            this.definitions[symbol] = JSON.stringify(!debugValue || mode === ProdMode ? value : debugValue);
        });
    },

    withNoParse: function withNoParse(path) {
        return extend(this, function () {
            if (this.module.noParse) {
                this.module.noParse.push(path);
            } else {
                this.module.noParse = [path];
            }
        })
    },

    withReact: function withReact() {
        return this.withExtension(".jsx", ".tsx");
    },

    withStyles() {
        return this.withRule({
            test: /\.(c|sa)ss$/i,
            use: [
                "css-loader",
                "sass-loader",
            ],
        });
    },

    withCss: function withCss(outFileName, debugOutFileName) {
        const MiniCssExtractPlugin = require("mini-css-extract-plugin");
        return extend(this, function ({mode}) {
            const filename = !debugOutFileName || mode === ProdMode
                ? outFileName
                : debugOutFileName;

            this.plugins.push(new MiniCssExtractPlugin({
                filename,
                chunkFilename: "[id].css",
            }));
        })
        .withRule({
            test: /\.(c|sa)ss$/i,
            use: [
                MiniCssExtractPlugin.loader,
                "css-loader",
                "sass-loader",
            ],
        });
    },

    withHtml: function withHtml(template, filename) {
        const HtmlWebPackPlugin = require("html-webpack-plugin");
        return this.withPlugin(HtmlWebPackPlugin, {template, filename});
    },

    withExternals: function withExternals(externals) {
        return extend(this, function() {
            if (!this.externals)
                this.externals = externals;
            else if (Array.isArray(this.externals))
                this.externals = this.externals.concat(externals);
            else
                this.externals = Object.assign({}, this.externals, externals);
        });
    },

    withNativeModules: function withNativeModules() {
        return extend(this.withExtension(".node"), function () {
            this.node = {
                __dirname: false,
            };

            this.module.rules.push({
                test: /\.node$/i,
                use: [
                    "native-ext-loader",
                ],
            });
        });
    },

    withFiles: function withFiles(files) {
        const CopyWebpackPlugin = require("copy-webpack-plugin");
        return this.withPlugin(CopyWebpackPlugin, {patterns: files});
    },

    withLicenseHint: function withLicenseHint(pkg, version, license) {
        return extend(this, function() {
            this.licenseConfig.licenseTypeOverrides[pkg] = license;
        });
    },

    withoutLicense: function withoutLicense(...name) {
        return extend(this, function() {
            name.map(n => this.unacceptableLicenses.add(n));
        });
    },

    withAttributionsPath: function withAttributionsPath(path) {
        return extend(this, function() {
            this.licenseConfig.outputFilename = path;
        });
    },

    withDevServer: function withDevServer(portOrPath, allowedHosts) {
        const patch = typeof portOrPath === "string" ? {ipc: portOrPath} : {port: portOrPath};
        return extend(this, function() {
            this.devServer = {
                ...patch,
                compress: true,
                allowedHosts,
            };
        });
    },

    withModulePaths: function withModulePaths(...path) {
        return extend(this, function() {
            this.resolve.modules = path;
        });
    },

    asLibrary: function asLibrary(type, name) {
        return extend(this, function() {
            this.output.library = name;
            this.output.libraryTarget = type;
        });
    },

    compile: function compile(target, entrypoint, outPath, outFileName, debugOutFileName) {
        this.directives.unshift(function ({mode}) {
            this.target = target;

            this.output.path = outPath;
            this.output.filename = !debugOutFileName || mode === ProdMode
                ? outFileName
                : debugOutFileName;

            this.entry = entrypoint;
        });

        return buildConfig.bind(this);
    },
};

function extend(that, f) {
    var result = Object.create(methods);
    result.directives = that.directives.concat(f);
    return result;
}

module.exports.newConfigBuilder = function newConfigBuilder() {
    return Object.create(methods);
};