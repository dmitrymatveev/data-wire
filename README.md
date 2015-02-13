
# Data Wire
Simple data abstraction layer between the client and associated data storage whichever it might be.

Main purpose of this module is to provide an easy to use abstraction in the form of a simple interface
for managing local and remote resources.

In the spirit of simplicity this module does not provide implementations of the data transport layer or
any sort of ORM apart from the bare bones object descriptor.

Instead, Data Wire makes it possible to tie-in whichever data storage you may have into whatever data
representation on the client, allowing the said client to carry on with its own business.