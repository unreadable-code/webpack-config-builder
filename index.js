'use strict';

const os = require("os");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const LicenseWebpackPlugin = require("license-webpack-plugin").LicenseWebpackPlugin;
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserJSPlugin = require("terser-webpack-plugin");
const TSLintPlugin = require("tslint-webpack-plugin");

const platform = os.platform();

const ProdMode = "production";

function buildConfig(env, argv) {
    var result = {
        output: {},

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
                    test: /\.(j|t)s(x?)$/,
                    exclude: /node_modules/,
                    loader: "babel-loader",
                },
            ],
        },

        plugins: [
            new TSLintPlugin({
                files: ["./src/**/*.ts"],
            }),
        ],
    };

    if (argv.mode === "production") {
        result.devtool = undefined;

        result.optimization = {
            minimizer: [
                new TerserJSPlugin({
                    cache: true,
                    parallel: true,
                    sourceMap: false,
                    terserOptions: {},
                    exclude: /\.(sa|sc|c)ss$/,
                }),
            ],
        };

        result.plugins.push(
            new LicenseWebpackPlugin({
                perChunkOutput: false,
                addBanner: false,
                outputFilename: "ATTRIBUTION.txt",
                preferredLicenseTypes: ["MIT", "ISC"]
            }));
    } else {
        result.devtool = "source-map";
    }

    this.directives.forEach(function (d) {
        d.call(result, argv);
    });

    return result;
}

const methods = {
    withExtension: function withExtensions(...extensions) {
        return extend(this, function () {
            this.resolve.extensions.push(...extensions);
        });
    },

    withPlugin: function withPlugin(plugin) {
        return extend(this, function () {
            this.plugins.push(plugin);
        });
    },

    withRule: function withRule(rule) {
        return extend(this, function () {
            this.module.rules.push(rule);
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

    withCss: function withCss(outFileName, debugOutFileName) {
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
                test: /\.sass$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader",
                ],
            });
    },

    withHtml: function withHtml(template, filename) {
        return this.withPlugin(new HtmlWebPackPlugin({template, filename}));
    },

    withExternals: function withExternals(externals) {
        return extend(this, function() {
            this.externals = Object.assign({}, this.externals, externals);
        });
    },

    withNativeModules: function withNativeModules() {
        return extend(this.withExtension(".node"), function () {
            this.node = {
                __dirname: false,
            };

            this.module.rules.push({
                test: /\.node$/,
                loader: "native-ext-loader",
            });
        });
    },

    withFiles: function withFiles(files) {
        return this.withPlugin(new CopyWebpackPlugin(files));
    },

    asLibrary: function asLibrary(type, name) {
        return extend(this, function() {
            this.output.library = name;
            this.output.libraryTarget = type;
        });
    },

    to: function to(target, path, outFileName, debugOutFileName) {
        this.directives.unshift(function ({mode}) {
            this.target = target;

            this.output.path = path;
            this.output.filename = !debugOutFileName || mode === ProdMode
                ? outFileName
                : debugOutFileName;
        });

        return this;
    },

    build: function build() {
        return buildConfig.bind(this);
    },
};

function extend(that, f) {
    var result = Object.create(methods);
    result.directives = that.directives.concat(f);
    return result;
}

module.exports.from = function from(entrypoint) {
    var result = Object.create(methods);

    result.directives = [
        function () {
            this.entry = entrypoint;
        },
    ];

    return result;
}