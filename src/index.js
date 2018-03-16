import get from "lodash/get";
import { css } from "emotion";

//
// WHAT IS cogstyle
//
// cogstyle is a tool for writing cross-framework
// composable styles.
//
// We do not want to rewrite our styles when new frameworks
// are released. In addition we want to be able to deal with
// mergers or acquisitions by quickly skining apps that may
// be written in frameworks other than our primary one.
//
// cogstyle's goal is to get you 80% of the way there so
// that you can have most of your styling be:
//   1. Composable
//   2. VanillaJS but geared towards component frameworks
//   3. Not element based or inline. We don't want to
//      3rd party libraries you are using.
//
// So how does it work?
//
// WHAT'S IN A PROPERTY?
//
// In React, a prop is a key and its value.
// or optionally just a key and truthy value.
//
// React:
//
// <MyComponent isCurrentlyActive={true} />
//                      |            |
//                     Key    +    Value
//                      |     =      |
//                       --[ Prop ]--
//
// In CSS the word 'property' historically refers to
// the key on the left hand side only and not to its
// value. Together they form a single declaration.
//
// CSS:
//    background-color:  #ffcc00
//        |                 |
//        |                 |
//    Property (no!)  +   value
//        |           =     |
//         -[ Declaration ]-
//
// cogstyle rejects the second set of definitions
// and accepts the same language as React. Key on the
// left and value on the right.
//
// Together a key and a value compose to create a
// composed prop. Let's see it in action.
//
// Cogstyle:
//   background-color:  #ffcc00
//        |             |
//       Key     +    Value
//        |      =      |
//      --[ Declaration ]--
//
// Now let's take several declarations together
// and when combined they make up a cog.
//                             __
//   color:  #ffcc00             |
//   background-color:  #ffcc00  | --- Cog
//                             __|
//
// You might think that this looks a lot like a class
// but actually a cog is closer to a css partial.
//
// The css name of a cog is generated and thus will
// change whenenver any key or value in the cog changes.
//
// This means that your cog cannot be extended except
// though a new feature that we'll introduce: props.
//
// If you are familiar with props in React or inputs
// in Angular then this should seem pretty familiar.
//
// Props are just values that you pass into a cog
// that will modify the behavior of that cog.
//
// So for example, we might want to change the background
// color of a cog. We could do this using a prop.
//
// INSERT PROP EXAMPLE HERE
//
// As a cog author I might want to allow people to change
// the background color of a cog, but only if the foreground
// color is of sufficient contrast. Using props I could set
// up this scenario where props interact and throw errors if
// given props that do not match my cogs.
//
// Because the css class is unpredictable, the property is not
// able to be overriden using the css class name and thus my
// component's style integrity will remain intact.
//
// INSERT OVERRIDE EXAMPLE HERE
//
// Additionally you'll notice that we place a line in each css
// class with the name of the cog so that you can debug easier
// than you might otherwise.
//
// INSERT cog name EXAMPLE HERE
//
// Remember that these are not inline styles. They are classes
// under the hood. This is important because it means we can
// change a given cog in our browser tools and it will actually
// change all components using that cog and still respect any
// composition of classes that we might have on an element.
//
// You may naturally still defined global styles and these
// will impact cogs but you will be decoupled from having semantics
// embedded in your class names.
//
// So what do you get for giving up meaningful class names? You get
// errors thrown when you try to use a cog that doesn't exist.
// You get an error thrown when you try to create a cog with a value
// that doesn't exist.
// You get to use your normal javascript methods to compose cogs.
// Most importantly you get a strong contract between cog author
// and cog user.

export const cogstyle = ({ from }) => {
  const lazyStringify = (entries, cogName) => {
    if (typeof entries === "string") {
      return `--cog-name: ${cogName};${entries}`;
    }
    return entries.reduce((a, entry) => {
      if (typeof entry[0] === "undefined" || entry[0] === "undefined") {
        throw new Error(
          `ERROR undefined key detected. ${a}${entry[0]}:${entry[1]};`
        );
      }
      return `${a}${entry[0]}:${entry[1]};`;
    }, `--cog-name: ${cogName};`);
  };
  const cog = (component, props = {}) => {
    const value = get(from, component);
    if (!value) throw new Error(`The cog '${component}' does not exist.`);
    if (value !== null && typeof value === "object") {
      const keys = Object.keys(value);
      const numKeys = keys.length;
      throw new Error(
        `Path to string cog expected. You selected the cog object '${component}'. Chances are you meant to select one of its child keys instead (${keys.reduce(
          (a, key, i) => {
            return a + component + "." + key + (i === numKeys - 1 ? "" : ", ");
          },
          ""
        )})`
      );
    }
    const { values, keys } = from;
    return css`
      ${typeof value === "function"
        ? lazyStringify(
            value({ props, p: props, keys, k: keys, values, v: values }),
            component
          )
        : value};
    `;
  };
  return {
    cog,
    rawCog: (component, props = {}) => {
      const value = get(from, component);
      if (!value)
        throw new Error(
          `Invalid style path ${component}. Check the path and try again.`
        );
      const { values = {}, keys = {} } = from;
      return typeof value === "function"
        ? lazyStringify(
            value({ props, p: props, keys, k: keys, values, v: values }),
            component
          )
        : value;
    },
    value: (component, props = {}) => {
      const value = get(from, "values." + component);
      if (!value)
        throw new Error(
          `Invalid string path ${component}. Check the path and try again.`
        );
      return value;
    },
    cogs: cogs => {
      return cogs
        .reduce((a, singleCog) => {
          return `${a} ${cog(singleCog)}`;
        }, "")
        .trim();
    }
  };
};
