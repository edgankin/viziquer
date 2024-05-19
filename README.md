[![License](http://img.shields.io/:license-mit-blue.svg)](https://raw.githubusercontent.com/LUMII-Syslab/viziquer/master/LICENSE)
# ViziShapes

The aim of the ViziShapes project is to provide visual/diagrammatic environment for SHACL constraints.


### To setup ViziShapes locally

1. Download and install _Meteor_ framework, follow instructions: https://www.meteor.com/install
1. Perform `git clone` for this repository.
1. Change to the `./vizishapes/app` directory.
1. Execute the command `meteor npm ci` to install the required _node_ packages.
1. Additionally, execute the command `meteor npm install get-stream@6.0.1` to install an older version of `get-stream` (it is workaround for dependency problem).
1. Now to run the ViziShapes tool, type `meteor` in the ViziShapes directory.
 To run on a specific port, type, for example, `meteor --port 4000`.
1. Open the web browser and type `localhost:3000` (default port: 3000) or with the specified port `localhost:4000`

## Configuration for the first use

1. The first user that signs up to the tool instance shall get administrator rights (the rights to manage tool configurations)
