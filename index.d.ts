import type {WebpackPluginInstance, Configuration, RuleSetRule, LoaderItem} from "webpack";

type AssetType = "asset/resource" | "asset/inline" | "asset/source" | "asset";

export interface Builder {
    withExtension(...extensions: string[]): this;
    withPlugin<C>(type: {new(cfg: C): WebpackPluginInstance}, config: C, debugConfig: C): this;
    withAssets(test: RegExp, type?: AssetType, loaders?: LoaderItem[]): this;
    withDefine(symbol: string, value: string, debugValue?: string): this;
    withNoParse(path: Configuration["module"]["noParse"]): this;

    withCss(outName: string, debugOutName?: string): this;

    /**
     * Enable CSS to be loaded but does not write them into a sheet file.
     * Best used with libraries
     */
    withStyles(): this;

    withHtml(templatePath: string, outName: string): this;

    withReact(): this;
    withExternals(externals: Configuration["externals"]): this;
    withNativeModules(): this;
    withFiles(options: string | unknown[]): this;

    withLicenseHint(name: string, version: string, license: string): this;
    withoutLicense(...name: string[]): this;
    withAttributionsPath(path): this;

    withDevServer(unixDomainSocketPath: string, allowedHosts?: string[]): this;
    withDevServer(httpPort: number, allowedHosts?: string[]): this;

    withModulePaths(...paths: string[]): this;

    asLibrary(type: "amd"|"umd"|"commonjs", name: string): this;

    compile(
        target: string,
        sourcePath: string,
        outPath: string,
        outFileName: string,
        debugOutFileName?: string,
    ): Configuration;
}

export function newConfigBuilder(): Builder;