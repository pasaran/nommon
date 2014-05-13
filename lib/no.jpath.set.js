//  ---------------------------------------------------------------------------------------------------------------  //

var _setters = {};

no.jpath.set = function(jpath, data, value) {
    var compiled = _setters[jpath] || (( _setters[jpath] = compileSetter(jpath) ));

    return compiled(data, value);
};

function compileSetter(jpath) {
    //  В jpath строка вида '.foo.bar'.

    var parts = jpath.split('.');

    //  Первый элемент массива игнорируем (там пустая строка).
    var i = 1;
    //  Последний будем обрабатывать особо. После цикла.
    var l = parts.length - 1;

    var body = 'var r = data; var t;';
    for (; i < l; i++) {
        //  Делаем "шаг". Т.е. примерно `r = r['foo'];`.
        body += 't = r["' + parts[i] + '"];';
        //  Если после "шага" получился null или undefined, создаем на этом месте пустой объект.
        body += 'if (t == null) { t = r["' + parts[i] + '"] = {}; }';
        body += 'r = t;';
    }
    //  Последний шаг — присваиваем значение.
    body += 'r["' + parts[i] + '"] = value;';
    body += 'return data;';

    return new Function('data', 'value', body);
}

