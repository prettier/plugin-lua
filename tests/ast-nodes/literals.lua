single_quoted_string = 'single-quoted string literal'
double_quoted_string = "string literal!"

multi_line_string = [[
  multi-line string literal!!
]]
single_line_multi_line = [[ one ]]
weird_multi_line = [=====[
  one
]=====]
weird_single_line_multi_line = [=====[
  stuff goes here y'all
]=====]

hex_escapes = "\x00 \x02"
octal_escapes = "\777 \650"
ascii_escapes = "\b\n\t\\"

numeric_literal_int = 42
numeric_literal_float = 42.0
hex_number = 0x64
hex_number_upper = 0XFF
scientific_notation_lower = 1.6e50
scientific_notation_upper = 6.23E-23

truthy = true
falsy = false

nillish = nil

vararg = ...
vararg_parens = (...)

function vararg_params(...)
end
