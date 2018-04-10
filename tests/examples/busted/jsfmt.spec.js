run_spec(__dirname, ["lua"]);
run_spec(__dirname, ["lua"], {
  trailingComma: "all",
  singleQuote: true,
  bracketSpacing: false,
});
