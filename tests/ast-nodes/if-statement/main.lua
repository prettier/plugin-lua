if condition then
  print("condition")
end

if condition1 then
  print("condition1")
elseif condition2 then
  print("condition2")
end

if condition_outer then
  print("condition_outer")
else if condition2 then
    print("condition_inner")
end
end
