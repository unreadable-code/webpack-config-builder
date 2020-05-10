'use strict';

const os = require("os");

const HtmlWebPackPlugin = require("html-webpack-plugin");
const LicenseWebpackPlugin = require("license-webpack-plugin").LicenseWebpackPlugin;
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserJSPlugin = require("terser-webpack-plugin");
const TSLintPlugin = require("tslint-webpack-plugin");

const platform = os.platform();

function buildConfig(env, argv) {
    var result = {
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
    add: function(fn) {
        this.directives.push(fn);
        return this;
    },

    withExtension: function withExtensions(...extensions) {
        return this.add(function () {
            this.resolve.extensions.push(...extensions);
        });
    },

    withPlugin: function withPlugin(plugin) {
        return this.add(function () {
            this.plugins.push(plugin);
        });
    },

    withRule: function withRule(rule) {
        return this.add(function () {
            this.module.rules.push(rule);
        });
    },

    withNoParse: function withNoParse(path) {
        return this.add(function () {
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

    withCss: function withCss() {
        return this.withPlugin(new MiniCssExtractPlugin({
                filename: "[name].css",
                chunkFilename: "[id].css",
            }))
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

    withNativeModules: function withNativeModules() {
        return this.withExtension(".node")
            .add(function () {
                this.node = {
                    __dirname: false,
                };

                this.module.rules.push({
                    test: /\.node$/,
                    loader: "native-ext-loader",
                });
            });
    },

    to: function to(target, path, outFileName, debugOutFileName) {
        this.add(function ({mode}) {
            this.target = target;

            const filename = !debugOutFileName || mode === "production"
                ? outFileName
                : debugOutFileName;

            this.output = {path, filename};
        });

        return buildConfig.bind(this);
    },
};

module.exports.from = function from(entrypoint) {
    var result = Object.create(methods);

    result.directives = [
        function () {
            this.entry = entrypoint;
        },
    ];

    return result;
}