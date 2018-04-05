empty = {}

one_thing = { thing }

one_keyed_thing = { keyed = thing }

more_than_one_thing = { thing, thing }

more_than_one_keyed_thing = {
  keyed = thing,
  keyed = thing
}

computed_keys = {
  [1.0] = "one!",
  [2.0] = "two!",
  ["string"] = "string",
  [2 + 2] = "minus one that's three quick maths",
  [L"Welcome to City 17"] = "You have chosen, or, been chosen...",
  [true] = false,

  __index = function(self, key)
    return rawget(self, key)
  end
}

crazy_nesting = {
  a = {
    b = {
      c = {
        d = {
          e = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, foo = bar, ["aaaaa!!!!"] = "aaaaa!!!!" }
        }
      }
    }
  },
  [{ please = "no" }] = { please = "yes" },
  [45.6] = { 45.6, 45.6, 45.6, 45.6 },
  [{ 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0 }] = { this_kills_the_crab }
}
