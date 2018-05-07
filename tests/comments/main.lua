-- line comment in chunk
dosomething()
-- another line comment in chunk

function Function()
  -- line comment in Function
  if --[[before if conditional]] --[[another before if conditional]] true --[[after if conditional]] then -- end of if line
    dooo() -- end of call in if
  end
end

function Foo()
 -- comment in empty function body
end

function --[[between function keyword and name]] Bar()
end

function --[==[ between function keyword and name ]==] Bar()
end

for k,v in pairs(t) do
  -- comment in empty for body
end

if true then
  -- hello
elseif CLIENT then
  functioncall()
end
