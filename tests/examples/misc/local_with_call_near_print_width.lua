do
    do
        local one, two, three, four, five, six, seven, eight, nine, ten = callSomething("Hello it is me")
        local success, errcnt = executeBusted("--pattern=_tags.lua$ --tags=dtag1")
    end
end

describe(function()
    it("bla", function()
        local one, two, three, four, five, six, seven, eight, nine, ten = callSomething("Hello it is me")
        local success, errcnt = executeBusted("--pattern=_tags.lua$ --tags=dtag1")
    end)
end)
