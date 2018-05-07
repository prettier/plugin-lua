-- x + y % z --> (x + y) % z
a = x + y % z

-- ^ is right-associative
-- x ^ y ^ z --> x ^ (y ^ z)
a = x ^ y ^ z

-- x == y == z --> (x == y) == z
a = x == y == z

-- x * y % z --> (x * y) % z
a = x * y % z

-- x * y / z --> (x * y) / z
-- x / y * z --> (x / y) * z
a = x * y / z
a = x / y * z

-- x << y << z --> (x << y) << z
a = x << y << z
