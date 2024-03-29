# Welcome to the Isle of Trust

The Isle of Trust is a react based web game designed to invoke deep thoughts on topics such as morality, influence and the greater good.

You can view the stable application deployed from main here:
https://prisoners-dilemma.gitlab.io/Release/

## Getting started

Clone the repository to your local machine:

```shell
git clone https://gitlab.com/Prisoners-Dilemma/Release.git
```

You will also need the following installed:

-   [Yarn](https://yarnpkg.com/)
-   [ImageMagick](https://imagemagick.org/index.php)

## Build

To compile the project and generate artifacts in the `build/` directory run:

```shell
yarn install
yarn build
```

Note that warnings generated by this script will be treated as failures in the
CI/CD pipeline.

## Deployment

To deploy your local branch for development purposes run:

```shell
yarn start
```

The application will be hosted on http://localhost:3000/

## Formatting

Enjoy the magic of auto formatting with the following command:

```shell
npx eslint src --fix
```

This should eliminate any linter related warnings from the compiler.

## Testing

```shell
yarn test
```

Will open a TUI to run all or some tests.

## Branching

The primary branches for this repository are develop and main. All features should be implemented through feature branches derived from and merge requested in to develop. Stable snapshots of develop will be periodically merged into main.
