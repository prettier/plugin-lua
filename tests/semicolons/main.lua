(function()
  print("first")
end)();

(function()
  print("second")
end)()

local a = (1);

(function()
  print("first")
end)()

a = (1);

(function()
  print("first")
end)()

local a = a or (1);

(function()
  print("first")
end)()

local a = a or a or a or a and (1);

(function()
  print("first")
end)()

local a = a or (a and b);

(function()
  print("first")
end)()

local a = a + (1);

(function()
  print("first")
end)()

local a = a + 2 + 4 + (5 + 6 - 1);

(function()
  print("first")
end)()

local a = a or (not b);

(function()
  print("first")
end)()


local identifier_semi = (a);
(function()
end)()
