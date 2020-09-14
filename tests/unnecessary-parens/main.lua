remove = (a)
remove = (2e16)
remove = (true)
remove = (nil)
remove = ("a")
remove = ([[ a ]])
remove = (a.b)
remove = (a["a"])
remove = (a())
remove = (not a)
remove = (-1)

a, b, c = (a())
a, b, c = (a()), (b())
a, b, c = (a()), (b()), (c())
a, b, c = ...
a, b, c = (...)
a, b, c = (...), (b())
a, b, c = (...), (b()), (c())

local a, b, c = (a())
local a, b, c = (a()), (b())
local a, b, c = (a()), (b()), (c())
local a, b, c = ...
local a, b, c = (...)
local a, b, c = (...), (b())
local a, b, c = (...), (b()), (c())

a = (a())
a = (a()), (b())
a = (a()), (b()), (c())
a = ...
a = (...)
a = (...), (b())
a = (...), (b()), (c())

local a = (a())
local a = (a()), (b())
local a = (a()), (b()), (c())
local a = ...
local a = (...)
local a = (...), (b())
local a = (...), (b()), (c())

a, b, c, d, e, f = (a())
a, b, c, d, e, f = (a()), (b())
a, b, c, d, e, f = (a()), (b()), (c())
a, b, c, d, e, f = ...
a, b, c, d, e, f = (...)
a, b, c, d, e, f = (...), (b())
a, b, c, d, e, f = (...), (b()), (c())

local a, b, c, d, e, f = (a())
local a, b, c, d, e, f = (a()), (b())
local a, b, c, d, e, f = (a()), (b()), (c())
local a, b, c, d, e, f = ...
local a, b, c, d, e, f = (...)
local a, b, c, d, e, f = (...), (b())
local a, b, c, d, e, f = (...), (b()), (c())

local a = {
  a = (a()), (b())
}

function you_need_me_1()
  return (a())
end

function you_need_me_2()
  return (a()), (b())
end

function you_need_me_3()
  return (a()), (b()), (c())
end

function you_need_me_1()
  return (a"")
end

function you_need_me_2()
  return (a""), (b"")
end

function you_need_me_3()
  return (a""), (b""), (c"")
end

function you_need_me_1()
  return (a{})
end

function you_need_me_2()
  return (a{}), (b{})
end

function you_need_me_3()
  return (a{}), (b{}), (c{})
end

function you_need_me_1(...)
  return ...
end

function you_need_me_1(...)
  return (...)
end

function you_need_me_2(...)
  return (...), (b())
end

function you_need_me_3(...)
  return (...), (b()), (c())
end



local please = (((((a)))))

local dont_touch_math = (2 + 2) + (2 - 2)
local dont_touch_logic = (2 and 2) or (2 and 2)

keep = (2e16)()
keep = (true)()
keep = (nil)()
keep = ("a")()
keep = ([[ a ]])()
keep = (not a)()
keep = (-1)()

remove = (a)()
remove = (a.b)()
remove = (a["a"])()
remove = (a())()
