-- line comment in chunk
dosomething()
-- another line comment in chunk

function Function()
  -- line comment in Function
  if --[[before if conditional]] --[[another before if conditional]] true --[[after if conditional]] then -- end of if line
    dooo() -- end of call in if
  end
end

it('is a test with pattern3', function()
  -- comment in empty body
end)