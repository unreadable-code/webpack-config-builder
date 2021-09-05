import type {WebpackPluginInstance, Configuration, RuleSetRule} from "webpack";

export interface Builder {
    withExtension(...extensions: string[]): this;
    withPlugin<C>(type: {new(cfg: C): WebpackPluginInstance}, config: C, debugConfig: C): this;
    withAssets(test: RegExp): this;
    withDefine(symbol: string, value: string, debugValue?: string): this;
    withNoParse(path: Configuration["module"]["noParse"]): this;

    withCss(outName: string, debugOutName?: string): this;
    withHtml(templatePath: string, outName: string): this;

    withReact(): this;
    withExternals(externals: Configuration["externals"]): this;
    withNativeModules(): this;
    withFiles(options: string | unknown[]): this;

    withLicenseHint(name: string, version: string, license: string): this;
    withoutLicense(...name: string[]): this;
    withAttributionsPath(path): this;

    withDevServer(port: number, allowedHosts?: string[]): this;

    asLibrary(type: "amd"|"umd"|"commonjs", name: string): this;

    to(target: string, path: string, outFileName: string, debugOutFileName?: string): Configuration;
}

export function from(path: string, ...roots?: string[]): Builder;