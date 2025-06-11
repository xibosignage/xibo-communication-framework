// rollup.config.ts
import type { InputOptions, OutputOptions, RollupOptions } from 'rollup';

import { nodeResolve as nodeResolvePlugin } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescriptPlugin from '@rollup/plugin-typescript';
import babelPlugin from '@rollup/plugin-babel';
import analyzerPlugin from 'rollup-plugin-analyzer';
import terserPlugin from '@rollup/plugin-terser';
import dtsPlugin from 'rollup-plugin-dts';

const libName = 'xibo-communication-framework';
const outputPath = 'dist/';
const commonInputOptions: InputOptions = {
    input: 'src/index.ts',
    external: ['xibo-interactive-control', 'luxon'],
    plugins: [
        nodeResolvePlugin({
            preferBuiltins: true,
            mainFields: ['module', 'main'],
            browser: true,
        }),
        commonjs({
          include: ['node_modules/**'],
          extensions: ['.js', '.ts'],
        }),
        babelPlugin({
            include: ['src/**', 'node_modules/nanoevents/**', 'node_modules/luxon/**'],
            // extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts'],
            extensions: ['.js', '.ts'],
            passPerPreset: true,
            babelHelpers: 'bundled',
            presets: ['@babel/preset-env'],
        }),
        typescriptPlugin(),
        analyzerPlugin({
          summaryOnly: true,
        }),
    ],
};

const iifeCommonOutputOptions: OutputOptions = {
    name: 'XiboCommunicationFramework',
};

const config: RollupOptions[] = [
    {
        ...commonInputOptions,
        output: [
            {
                file: `${outputPath}${libName}.esm.js`,
                format: 'esm',
                exports: 'named',
                sourcemap: true,
                globals: {
                    'luxon': 'luxon',
                },
            }
        ],
    },
    {
        ...commonInputOptions,
        output: [
            {
                ...iifeCommonOutputOptions,
                file: `${outputPath}${libName}.js`,
                format: 'iife',
                exports: 'named',
                globals: {
                    'luxon': 'luxon',
                },
            },
            {
                ...iifeCommonOutputOptions,
                file: `${outputPath}${libName}.min.js`,
                format: 'iife',
                sourcemap: true,
                exports: 'named',
                plugins: [
                    terserPlugin(),
                ],
                globals: {
                    'luxon': 'luxon',
                },
            }
        ],
    },
    {
        ...commonInputOptions,
        plugins: [commonInputOptions.plugins],
        output: [
            {
                file: `${outputPath}${libName}.cjs.js`,
                format: 'cjs',
                sourcemap: true,
                exports: 'named',
            }
        ],
    },
    {
        ...commonInputOptions,
        plugins: [commonInputOptions.plugins, dtsPlugin()],
        output: [
            {
                file: `${outputPath}${libName}.d.ts`,
                format: 'esm',
            }
        ],
    },
    {
        ...commonInputOptions,
        plugins: [commonInputOptions.plugins],
        output: [
            {
                file: `${outputPath}${libName}.amd.js`,
                format: 'amd',
                sourcemap: true,
            }
        ],
    },
];

export default config;
