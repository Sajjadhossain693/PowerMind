from app.utils.time_parser import extract_hour_range, parse_hour_token

def test_parse_hour_token():
    assert parse_hour_token("13:00") == 13
    assert parse_hour_token("1pm") == 13
    assert parse_hour_token("3pm") == 15
    assert parse_hour_token("one", default_period="pm") == 13
    assert parse_hour_token("three", default_period="pm") == 15
    assert parse_hour_token("midnight") == 0
    assert parse_hour_token("noon") == 12

def test_extract_hour_range_24h():
    res = extract_hour_range("Cleaning between 13:00 and 15:00.")
    assert res == [13, 14]

def test_extract_hour_range_12h():
    res = extract_hour_range("Maintenance window from 1 PM to 3 PM.")
    assert res == [13, 14]

def test_extract_hour_range_evening():
    res = extract_hour_range("Reserve battery between 18:00 and 21:00.")
    assert res == [18, 19, 20]

def test_extract_hour_range_words():
    res = extract_hour_range("Panel washing from one until three in the afternoon will leave one fifth.")
    assert res == [13, 14]
