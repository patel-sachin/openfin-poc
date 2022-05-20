// this declaration is required to use `import IMAGE from 'somefolder/theImage.png'`
// statement in a tsx or jsx file
declare module '*.png'

// similarly we also need the same for svg files
declare module '*.svg' {
  const content: string
  export default content
}